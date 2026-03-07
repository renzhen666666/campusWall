import { ref, inject } from 'vue'
import dayjs from 'dayjs'
import { useRouter } from 'vue-router'

const Alert = inject('Alert')

const router = useRouter()

const staticUrl = import.meta.env.VITE_STATIC_URL || '/static/'
const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5410'

export default {
    getAvatarUrl (userId) {
        return `${apiUrl}user/static/avatar/${userId}`
    },
    handleAvatarError (event) {
        event.target.src = `https://cdn.long-gao.com/file/longgaowall/1771754675362_placeholder.png`
    },
    truncateText (text, maxLength) {
        if (!text) return ''
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
    },
    follow(id) {
        Alert.showTopRightAlert('施工中. . .', 'warning')
        return
    },
    unfollow(id) {
        Alert.showTopRightAlert('施工中. . .', 'warning')
        return
    },

    goToProfile () {
        router.push(`/user/${props.user.id}`)   
    },
    
    getGenderClass (gender)  {
        return gender === 1 ? 'male' : 'female'
    },

    getGenderIcon (gender)  {
        return gender === 1 ? 'bi bi-gender-male' : 'bi bi-gender-female'
    },

    getGenderText (gender)  {
        return gender === 1 ? '男' : '女'
    },

    formatBirthday (birthday)  {
        const age = dayjs().diff(dayjs(birthday), 'year')
        return `${birthday} (${age}岁)`
    },
    async getUserById (userId) {
        // 这里应该从后端获取用户信息
        // 暂时返回一个默认对象
        return new Promise((resolve) => {
            setTimeout(() => {
                if(userId === 0)
                    resolve({
                        success:true,
                        data: {
                            id: 0,
                            nickname: '匿名用户',
                            description: '龙高校园墙 Ciallo～(∠・ω< )⌒★',
                            following: [],
                            followers: [],
                            gender: 1
                        }
                    })
                else
                    resolve({
                        success:true,
                        data: {
                            id: userId, 
                            nickname: `用户${userId}`,
                            description: '',
                            following: [],
                            followers: [],
                            gender: 1
                        }
                    })
            }, 1000)
        })
    }
}